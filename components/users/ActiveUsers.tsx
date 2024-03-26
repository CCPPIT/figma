import { useOthers, useSelf } from '@/liveblocks.config'
import React, { useMemo } from 'react'
import Avatar from './Avatar';
import { generateRandomName } from '@/lib/utils';

const ActiveUsers = () => {
    const users=useOthers();
    const currentUser=useSelf();

    const memoizeUser=useMemo(()=>{
        const hasMoreUsers=users.length>2;

        return (
            <div className='flex items-center justify-center gap-1'>
                {currentUser&&(
                    <Avatar name='You' otherStyles='border-[3px] border-primary-green'/>
                )}
                {users.slice(0,2).map(({connectionId})=>(
                    <Avatar
                    key={connectionId}
                    name={generateRandomName()}
                    otherStyles='-ml-3'
                    />
                ))}
                {hasMoreUsers&&(
                <div className='z-10 -ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-black'>
                    +{users.length-2}
                    </div>
                    
        
                )}
        
                
            </div>
          );
        },

    [users.length]);
     return memoizeUser;
}
  

export default ActiveUsers