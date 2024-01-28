import { CollectionConfig } from 'payload/types';
import { PRODUCT_CATEGORIES } from '../../config';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  access: {},
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
};
