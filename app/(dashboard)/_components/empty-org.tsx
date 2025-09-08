import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { APP } from '@/lib/constants'
import { CreateOrganization } from '@clerk/nextjs'
import Image from 'next/image'
import React from 'react'

const EmptyOrg = () => {
  return (
    <div className='h-full items-center justify-center flex flex-col'>
        <Image
            src={"/elements.svg"}
            alt='empty'
            height={200}
            width={200}
        />
        <h2 className='text-2xl font-semibold mt-6'>Welcome to {APP.APP_NAME}</h2>
        <p className='text-muted-foreground text-sm mt-2'>Create an organization to get started</p>
        <div className="mt-6">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size={"lg"}>
                        Create organization
                    </Button>
                </DialogTrigger>
                <DialogContent className='bg-transparent p-0 border-none shadow-none max-w-[480px] flex justify-end'>
                    <CreateOrganization />
                </DialogContent>
            </Dialog>
        </div>
    </div>
  )
}

export default EmptyOrg