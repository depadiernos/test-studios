import { type DocumentId, getPublishedId } from '@sanity/id-utils';
import type { CustomValidator, Rule, SlugIsUniqueValidator } from '@sanity/types';
import groq from 'groq';

// import { apiVersion } from '../config';
// import { DEFAULT_LOCALE } from '../i18n.constants';
// import type { Locale, Slug } from '../schemas.types';

// import { createSlugVariants } from './createSlugVariants';
// import { normalizeSlug } from './normalizeSlug';

const apiVersion = '2025-06-18';
export type Slug = {
  _type: 'slug';
  current: string;
  source?: string;
};

export function createSlugVariants(slug) {
  const segments = slug.split('/').filter(Boolean);

  if (segments.length === 0) {
    return ['/'];
  } else {
    const trimmedSlug = segments.join('/');

    return [`/${trimmedSlug}`, `/${trimmedSlug}/`, `${trimmedSlug}`, `${trimmedSlug}/`];
  }
}

export function trimUrlSegment(slug) {
  return slug?.replace(/^[\s/]+|[\s/]+$/g, '') ?? '';
}

export function normalizeSlug(slug) {
  if (!slug) {
    return slug;
  }

  return '/' + trimUrlSegment(slug).toLowerCase() + '/';
}

const isUniqueSlugQuery = groq`
  !defined(*[
    _type == $type
    && !sanity::versionOf($publishedId)
    && lower(slug.current) in $slugs
  ][0]._id)`;

export const isUniqueAcrossAllDocuments: SlugIsUniqueValidator = async (
  slug,
  { document, getClient }
) => {
  const client = getClient({ apiVersion }).withConfig({ perspective: 'raw' });
  const id = document?._id as DocumentId | undefined;

  if (!id || !slug?.current) {
    return true;
  }

  const publishedId = getPublishedId(id);

  const isSlugUnique = await client.fetch<boolean>(isUniqueSlugQuery, {
    publishedId,
    type: document?._type,
    slugs: createSlugVariants(slug.current.toLowerCase()),
  });

  if (!isSlugUnique) {
    return false;
  }

  return true;
};

export const isSlugUniqueAcrossAllDocuments: CustomValidator<Slug> = async (
  slug,
  { document, getClient }
) => {
  const client = getClient({ apiVersion }).withConfig({ perspective: 'raw' });
  const id = document?._id as DocumentId | undefined;

  if (!id || !slug?.current) {
    return true;
  }

  const publishedId = getPublishedId(id);

  const isSlugUnique = await client.fetch<boolean>(isUniqueSlugQuery, {
    publishedId,
    type: document?._type,
    slugs: createSlugVariants(slug.current.toLowerCase()),
  });

  if (!isSlugUnique) {
    return 'Slug is not unique';
  }

  return true;
};

export const validateIsLowerCase: CustomValidator<Slug> = async (slug) => {
  if (!slug?.current) {
    return true;
  }

  if (slug.current !== slug.current.toLowerCase()) {
    return 'Use lower case in slug';
  }

  return true;
};

export const validateHasEmptySpaces: CustomValidator<Slug> = async (slug) => {
  if (!slug?.current) {
    return true;
  }

  if (/\s/.test(slug.current)) {
    return 'Spaces are not allowed in the slug field';
  }

  return true;
};

export const validateHasSpecialSymbols: CustomValidator<Slug> = async (slug) => {
  if (!slug?.current) {
    return true;
  }

  const hasInvalidCharacters = /[^a-z0-9\-/_]/.test(slug.current);
  const endWithSlash = slug.current.endsWith('/');
  const startsWithSlash = slug.current.startsWith('/');

  if (hasInvalidCharacters || !endWithSlash || !startsWithSlash) {
    return `Invalid slug format.
    Please ensure the slug contains only lowercase letters, numbers, forward slashes, hyphens and underscores,
    starts with a leading slash and ends with a trailing slash.
    Avoid using dots in URLs to prevent issues with routing.`;
  }

  return true;
};

const validateHasIncorrectStructure: CustomValidator<Slug> = async (slug) => {
  if (!slug?.current) {
    return true;
  }

  if (/\/{2,}|\.{2,}\/|\/\.{1}\//.test(slug.current)) {
    return 'Incorrect slug structure';
  }

  return true;
};

export const slugValidations = (rule: any) => [
  rule
    .required()
    //.custom(isSlugUniqueAcrossAllDocuments)
    .custom(validateIsLowerCase)
    .custom(validateHasIncorrectStructure)
    .custom(validateHasSpecialSymbols)
    .error(),
  rule.custom(validateHasEmptySpaces).warning(),
];