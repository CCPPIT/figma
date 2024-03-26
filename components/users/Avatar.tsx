import Image from 'next/image';
import React from 'react'
type Props={
    name:string;
    otherStyles?:string;
}

const Avatar = ({name,otherStyles}:Props) => {
  return (
    <div className={`relative h-9 w-9 rounded-full ${otherStyles}`} data-tooltip={name}>
        <Image
            src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
            fill
            className="rounded-full"
            alt={name}
            />
    </div>
  )
}

export default Avatar