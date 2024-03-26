"use client";
import {fabric} from "fabric";
import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import { handleResize, handleCanvasMouseDown, initializeFabric, handleCanvasMouseMove, handleCanvasMouseUp, renderCanvas, handleCanvasObjectModified, handleCanvasSelectionCreated, handleCanvasObjectScaling, handleCanvasObjectMoving, handlePathCreated } from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defalutNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";


 const Page=() =>{
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const fabricRef=useRef<fabric.Canvas|null>(null);
  const isDrawing=useRef(false);
  const shapeRef=useRef<fabric.Object | null>(null);
  const selectedShapeRef=useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeObjectRef=useRef<fabric.Object | null>(null);
  const isEditingRef=useRef(false);
  const undo=useUndo();
  const redo=useRedo();
    /**
   * useStorage is a hook provided by Liveblocks that allows you to store
   * data in a key-value store and automatically sync it with other users
   * i.e., subscribes to updates to that selected data
   *
   * useStorage: https://liveblocks.io/docs/api-reference/liveblocks-react#useStorage
   *
   * Over here, we are storing the canvas objects in the key-value store.
   */
    const deleteAllShapes = useMutation(({ storage }) => {
      // get the canvasObjects store
      const canvasObjects = storage.get("canvasObjects");
  
      // if the store doesn't exist or is empty, return
      if (!canvasObjects || canvasObjects.size === 0) return true;
  
      // delete all the shapes from the store
      for (const [key, value] of canvasObjects.entries()) {
        canvasObjects.delete(key);
      }
  
      // return true if the store is empty
      return canvasObjects.size === 0;
    }, []);
  const canvasObjects=useStorage((root)=>root.canvasObjects);


  const syncShapeInStorage=useMutation(({storage},object)=>{
    if(!object) return;
    const{objectId} = object;
    const shapeData = object.toJSON();
    shapeData.objectId = objectId;
    const canvasObjects = storage.get("canvasObjects");

    canvasObjects.set(objectId,shapeData);

  },[]);
  
  const deleteShapeFromStorage=useMutation(({storage},shapeId)=>{
    const canvasObjects=storage.get("canvasObjects");
    canvasObjects.delete(shapeId);

  },[]);
    /**
   * elementAttributes is an object that contains the attributes of the selected
   * element in the canvas.
   *
   * We use this to update the attributes of the selected element when the user
   * is editing the width, height, color etc properties/attributes of the
   * object.
   */
  const[elementAttribute,setElementAttributes]=useState<Attributes>({
    width:"",
    height:"",
    fontSize:"",
    fontFamily:"",
    fontWeight:"",
    fill:"#aabbcc",
    stroke:"#aabbcc",

  })

  const[activeElement,setActiveElement]=useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });
   /**
   * Set the active element in the navbar and perform the action based
   * on the selected element.
   *
   * @param elem
   */
  
  const handleActiveElement=((elem:ActiveElement)=>{
    setActiveElement(elem);
    switch(elem?.value){
      case "reset":
         // clear the storage
         deleteAllShapes();
         // clear the canvas
         fabricRef.current?.clear();
         setActiveElement(defalutNavElement);
         break;
         case "delete":
          handleDelete(fabricRef.current as any,deleteShapeFromStorage);
          setActiveElement(defalutNavElement);
          break;
          case "image":
            imageInputRef.current?.click();
            isDrawing.current=false;
            if(fabricRef.current){
              fabricRef.current.isDrawingMode=false;
            }
            break;

      // for comments, do nothing
      case "comments":
        break;

      default:
        // set the selected shape to the selected element
        selectedShapeRef.current = elem?.value as string;
        break;

    }
    selectedShapeRef.current=elem?.value as string;
  })



  useEffect(() => {
    // initialize the fabric canvas
    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
    });

    /**
     * listen to the mouse down event on the canvas which is fired when the
     * user clicks on the canvas
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    });

    /**
     * listen to the mouse move event on the canvas which is fired when the
     * user moves the mouse on the canvas
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:move", (options) => {
      handleCanvasMouseMove({
        options,
        canvas,
        isDrawing,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the mouse up event on the canvas which is fired when the
     * user releases the mouse on the canvas
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
      });
    });

    /**
     * listen to the path created event on the canvas which is fired when
     * the user creates a path on the canvas using the freeform drawing
     * mode
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("path:created", (options) => {
      handlePathCreated({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the object modified event on the canvas which is fired
     * when the user modifies an object on the canvas. Basically, when the
     * user changes the width, height, color etc properties/attributes of
     * the object or moves the object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the object moving event on the canvas which is fired
     * when the user moves an object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
     canvas?.on("object:moving", (options) => {
       handleCanvasObjectMoving({
        options,
      });
     });

    /**
     * listen to the selection created event on the canvas which is fired
     * when the user selects an object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("selection:created", (options) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    });

    /**
     * listen to the scaling event on the canvas which is fired when the
     * user scales an object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("object:scaling", (options) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    });

    /**
     * listen to the mouse wheel event on the canvas which is fired when
     * the user scrolls the mouse wheel on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    // canvas.on("mouse:wheel", (options) => {
    //   handleCanvasZoom({
    //     options,
    //     canvas,
    //   });
    // });

    /**
     * listen to the resize event on the window which is fired when the
     * user resizes the window.
     *
     * We're using this to resize the canvas when the user resizes the
     * window.
     */
    window.addEventListener("resize", () => {
      handleResize({
        canvas: fabricRef.current,
      });
    });

    /**
     * listen to the key down event on the window which is fired when the
     * user presses a key on the keyboard.
     *
     * We're using this to perform some actions like delete, copy, paste, etc when the user presses the respective keys on the keyboard.
     */
    window.addEventListener("keydown", (e) =>
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    );

    // dispose the canvas and remove the event listeners when the component unmounts
    return () => {
      /**
       * dispose is a method provided by Fabric that allows you to dispose
       * the canvas. It clears the canvas and removes all the event
       * listeners
       *
       * dispose: http://fabricjs.com/docs/fabric.Canvas.html#dispose
       */
      canvas.dispose();

      // remove the event listeners
      window.removeEventListener("resize", () => {
        handleResize({
          canvas: null,
        });
      });

      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        })
      );
    };
  }, [canvasRef]); // run this effect only once when the component mounts and the canvasRef changes

  // render the canvas when the canvasObjects from live storage changes
  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  return (
   <main className="h-screen overflow-hidden">
         <Navbar
        imageInputRef={imageInputRef}
        activeElement={activeElement}
        handleImageUpload={(e: any) => {
          // prevent the default behavior of the input element
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
        handleActiveElement={handleActiveElement}
         />
         <section className="flex h-full flex-row">
          <LeftSidebar allShapes={Array.from(canvasObjects)}/>
         <Live canvasRef={canvasRef} redo={redo}undo={undo}/>
         <RightSidebar
         isEditingRef={isEditingRef}
         elementAttributes={elementAttribute}
        setElementAttributes={setElementAttributes}
        activeObjectRef={activeObjectRef}
        fabricRef={fabricRef}
        syncShapeInStorage={syncShapeInStorage}
         />

         </section>

    

   </main>
    
   
  );
}
export default Page;
