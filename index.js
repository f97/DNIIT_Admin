/* eslint-disable no-use-before-define */
const {Keystone} = require('@keystonejs/keystone');
const {PasswordAuthStrategy} = require('@keystonejs/auth-password');
const {GraphQLApp} = require('@keystonejs/app-graphql');
const {AdminUIApp} = require('@keystonejs/app-admin-ui');
const {MongooseAdapter: Adapter} = require('@keystonejs/adapter-mongoose');
const {Text, Checkbox, Select, Password, Relationship, File, Slug} = require('@keystonejs/fields');
const {Wysiwyg} = require('@keystonejs/fields-wysiwyg-tinymce');
const {LocalFileAdapter} = require('@keystonejs/file-adapters');
const {atTracking} = require('@keystonejs/list-plugins');
const initialiseData = require('./initial-data');

require('dotenv').config();

const fileAdapter = new LocalFileAdapter({
  src: './files',
  path: '/files',
});

const PROJECT_NAME = 'DNIIT_Admin';


const keystone = new Keystone({
  name: PROJECT_NAME,
  adapter: new Adapter({
    mongoUri: process.env.MONGO_URI,
  }),
  onConnect: initialiseData,
});

// Access control functions
const userIsAdmin = ({authentication: {item: user}}) => Boolean(user && user.isAdmin);
const userOwnsItem = ({authentication: {item: user}}) => {
  if (!user) {
    return false;
  }
  return {id: user.id};
};
const userIsAdminOrOwner = (auth) => {
  const isAdmin = access.userIsAdmin(auth);
  const isOwner = access.userOwnsItem(auth);
  return isAdmin || isOwner;
};
const access = {userIsAdmin, userOwnsItem, userIsAdminOrOwner};

keystone.createList('User', {
  fields: {
    name: {type: Text},
    email: {
      type: Text,
      isUnique: true,
    },
    isAdmin: {type: Checkbox},
    password: {
      type: Password,
    },
  },
  access: {
    read: access.userIsAdminOrOwner,
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
});

keystone.createList('Post', {
  fields: {
    titleEn: {type: Text, isRequired: true},
    titleVi: {type: Text, isRequired: true},
    titleFr: {type: Text, isRequired: true},
    slug: {
      type: Slug,
      from: 'titleEn',
    },
    state: {
      type: Select, options: 'draft, published, archived', defaultValue: 'draft', index: true, isRequired: true,
    },
    author: {
      type: Relationship, ref: 'User', index: true, isRequired: true,
    },
    category: {
      type: Relationship,
      ref: 'Category',
      index: true,
      isRequired: true,
      many: true,
    },
    thumbnail: {
      type: File,
      adapter: fileAdapter,
      hooks: {
        beforeChange: ({existingItem = {}}) => fileAdapter.delete(existingItem),
      },
    },
    contentEn: {type: Wysiwyg},
    contentVi: {type: Wysiwyg},
    contentFr: {type: Wysiwyg},
    excerptEn: {type: Text, isRequired: true, isMultiline: true},
    excerptVi: {type: Text, isRequired: true, isMultiline: true},
    excerptFr: {type: Text, isRequired: true, isMultiline: true},
  },
  plugins: [
    atTracking({}),
  ],
  access: {
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
});

keystone.createList('Category', {
  fields: {
    nameEn: {type: Text, isRequired: true},
    nameVi: {type: Text, isRequired: true},
    nameFr: {type: Text, isRequired: true},
    slug: {
      type: Slug,
      from: 'nameEn',
    },
  },
  plugins: [
    atTracking({}),
  ],
  access: {
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
});

keystone.createList('Page', {
  fields: {
    titleEn: {type: Text, isRequired: true},
    titleVi: {type: Text, isRequired: true},
    titleFr: {type: Text, isRequired: true},
    slug: {
      type: Slug,
      from: 'titleEn',
    },
    state: {
      type: Select, options: 'draft, published, archived', defaultValue: 'draft', index: true, isRequired: true,
    },
    author: {
      type: Relationship, ref: 'User', index: true, isRequired: true,
    },
    contentEn: {type: Wysiwyg},
    contentVi: {type: Wysiwyg},
    contentFr: {type: Wysiwyg},
  },
  plugins: [
    atTracking({}),
  ],
  access: {
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
});

keystone.createList('Menu', {
  fields: {
    menuEn: {type: Text, isRequired: true, isMultiline: true},
    menuVi: {type: Text, isRequired: true, isMultiline: true},
    menuFr: {type: Text, isRequired: true, isMultiline: true},
  },
  plugins: [
    atTracking({}),
  ],
  access: {
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
});


const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({
      enableDefaultRoute: true,
      authStrategy,
    }),
  ],
};
