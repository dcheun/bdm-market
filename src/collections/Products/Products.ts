import {
  AfterChangeHook,
  BeforeChangeHook,
} from 'payload/dist/collections/config/types'
import { Access, CollectionConfig } from 'payload/types'
import { PRODUCT_CATEGORIES } from '../../config'
import { stripe } from '../../lib/stripe'
import { Product, User } from '../../payload-types'

const addUser: BeforeChangeHook<Product> = async ({ req, data }) => {
  const user = req.user
  return { ...data, user: user.id }
}

const syncUser: AfterChangeHook<Product> = async ({ req, doc }) => {
  const fullUser = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
  })

  if (fullUser && typeof fullUser === 'object') {
    const { products } = fullUser

    // All these IDs will contain the id's we have created because this is an AfterChangeHook.
    const allIDs = [
      ...(products?.map((product) =>
        typeof product === 'object' ? product.id : product
      ) || []),
    ]
    // Find the one we just created.
    const createdProductIDs = allIDs.filter(
      (id, idx) => allIDs.indexOf(id) === idx
    )

    const dataToUpdate = [...createdProductIDs, doc.id]

    await req.payload.update({
      collection: 'users',
      id: fullUser.id,
      data: {
        products: dataToUpdate,
      },
    })
  }
}

const isAdminOrHasAccess =
  (): Access =>
  ({ req: { user: _user } }) => {
    const user = _user as User | undefined

    if (!user) return false
    if (user.role === 'admin') return true

    const userProductIDs = (user.products || []).reduce<Array<string>>(
      (acc, product) => {
        if (!product) return acc
        if (typeof product === 'string') {
          acc.push(product)
        } else {
          acc.push(product.id)
        }
        return acc
      },
      []
    )

    return {
      id: {
        in: userProductIDs,
      },
    }
  }

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: isAdminOrHasAccess(),
    update: isAdminOrHasAccess(),
    delete: isAdminOrHasAccess(),
  },
  hooks: {
    afterChange: [syncUser],
    beforeChange: [
      addUser,
      async (args) => {
        if (args.operation === 'create') {
          // We want to create a new product in stripe
          const data = args.data as Product

          const createdProduct = await stripe.products.create({
            name: data.name,
            default_price_data: {
              currency: 'USD',
              // unit_amount expects price in cents
              unit_amount: Math.round(data.price * 100),
            },
          })

          const updated: Product = {
            ...data,
            stripeId: createdProduct.id,
            priceId: createdProduct.default_price as string,
          }

          return updated
        } else if (args.operation === 'update') {
          // Product is already in stripe
          const data = args.data as Product

          const updatedProduct = await stripe.products.update(data.stripeId!, {
            name: data.name,
            default_price: data.priceId!,
          })

          const updated: Product = {
            ...data,
            stripeId: updatedProduct.id,
            priceId: updatedProduct.default_price as string,
          }

          return updated
        }
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship', // So we can connect product table to user table.
      relationTo: 'users',
      required: true, // Always associate a product with a user.
      hasMany: false, // A product cannot be created by multiple people.
      admin: {
        condition: () => false, // Hide this field from admin dashboard.
      },
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Product details',
    },
    {
      name: 'price',
      label: 'Price in USD',
      min: 0,
      max: 1000,
      type: 'number',
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: PRODUCT_CATEGORIES.map(({ label, value }) => ({ label, value })),
    },
    {
      name: 'product_files',
      label: 'Product file(s)',
      type: 'relationship',
      required: true,
      relationTo: 'product_files',
      hasMany: false,
    },
    // Ability for admins to audit products.
    {
      name: 'approvedForSale',
      label: 'Product Status',
      type: 'select',
      defaultValue: 'pending',
      access: {
        create: ({ req }) => req.user.role === 'admin',
        read: ({ req }) => req.user.role === 'admin',
        update: ({ req }) => req.user.role === 'admin',
      },
      options: [
        {
          label: 'Pending verification',
          value: 'pending',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Denied',
          value: 'denied',
        },
      ],
    },
    // Stripe for payment.
    {
      name: 'priceId',
      // These access can be overidden in code when we call getPayloadClient
      // to interact with Stripe.
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'stripeId',
      // These access can be overidden in code when we call getPayloadClient
      // to interact with Stripe.
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'images',
      type: 'array',
      label: 'Product images',
      minRows: 1,
      maxRows: 4,
      required: true,
      // For admin dashboard, it tries to infer by product name, but we can
      // explicitly set it here.
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true, // Require at least one image.
        },
      ],
    },
  ],
}
