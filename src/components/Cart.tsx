'use client'

import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import CartItem from './CartItem'
import { buttonVariants } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

const Cart = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false)

  const { items } = useCart()
  const itemCount = items.length

  const cartTotal = items.reduce(
    (total, { product }) => total + product.price,
    0
  )

  const fee = 1

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <Sheet>
      <SheetTrigger className='group -m-2 flex items-center p-2'>
        <ShoppingCart
          className='h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
          aria-hidden='true'
        />
        <span className='ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800'>
          {isMounted ? itemCount : 0}
        </span>
      </SheetTrigger>
      <SheetContent className='flex w-full flex-col pr-0 sm:max-w-lg'>
        <SheetHeader className='space-y-2.5 pr-6'>
          <SheetTitle>Cart ({itemCount})</SheetTitle>
        </SheetHeader>
        {itemCount > 0 ? (
          <>
            <div className='flex w-full flex-col pr-6'>
              <ScrollArea>
                {items.map(({ product }) => (
                  <CartItem key={product.id} product={product} />
                ))}
              </ScrollArea>
            </div>
            <div className='space-y-4 pr-6'>
              <Separator />
              <div className='space-y-1.5 text-sm'>
                <div className='flex'>
                  <span className='flex-1'>Shipping</span>
                  <span>Free</span>
                </div>
                <div className='flex'>
                  <span className='flex-1'>Transaction Fee</span>
                  <span>{formatPrice(fee)}</span>
                </div>
                <div className='flex'>
                  <span className='flex-1'>Total</span>
                  <span>{formatPrice(cartTotal + fee)}</span>
                </div>
              </div>

              <SheetFooter>
                {/* NOTE: Default for SheetTrigger wraps element in a button
                The asChild property disables that behavior. */}
                <SheetTrigger asChild>
                  <Link
                    href='/cart'
                    className={buttonVariants({
                      className: 'w-full',
                    })}
                  >
                    Continue to Checkout
                  </Link>
                </SheetTrigger>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className='flex h-full flex-col items-center justify-center space-y-1'>
            <div
              className='relative mb-4 h-60 w-60 text-muted-foreground'
              aria-hidden='true'
            >
              <Image
                src='/hippo-empty-cart.png'
                fill
                alt='empty shopping cart hippo'
                sizes='100vw'
              />
            </div>
            <div className='text-xl font-semibold'>Your cart is empty</div>
            <SheetTrigger asChild>
              <Link
                href='/products'
                className={buttonVariants({
                  variant: 'link',
                  size: 'sm',
                  className: 'text-sm text-muted-foreground',
                })}
              >
                Add items to your cart to checkout
              </Link>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default Cart
