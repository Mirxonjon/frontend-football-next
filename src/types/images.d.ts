// Override Next.js default static image typings so existing JSX code that
// uses image imports directly as `<img src={img} />` keeps type-checking.
// (Next still resolves these to StaticImageData at runtime; the `.src` field
// is what the browser actually uses, but coerce-to-string keeps things working.)

declare module "*.png" {
  const src: any;
  export default src;
}

declare module "*.jpg" {
  const src: any;
  export default src;
}

declare module "*.jpeg" {
  const src: any;
  export default src;
}

declare module "*.gif" {
  const src: any;
  export default src;
}

declare module "*.svg" {
  const src: any;
  export default src;
}

declare module "*.webp" {
  const src: any;
  export default src;
}
