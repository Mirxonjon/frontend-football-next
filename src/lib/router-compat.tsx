"use client";

// Thin react-router-dom compatibility shim for Next.js App Router.
// Re-exports `Link`, `NavLink`, `useNavigate`, `useParams`, `useLocation`
// with the same APIs the existing components were using.

import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams as nextUseParams,
} from "next/navigation";
import React, {
  forwardRef,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to?: string | { pathname: string; search?: string };
  href?: string | { pathname: string; search?: string };
  replace?: boolean;
  children?: ReactNode;
};

const toHref = (to: LinkProps["to"] | LinkProps["href"]): string => {
  if (!to) return "#";
  if (typeof to === "string") return to;
  return `${to.pathname}${to.search ?? ""}`;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function Link({ to, href, replace, children, ...rest }, ref) {
    return (
      <NextLink ref={ref} href={toHref(to ?? href)} replace={replace} {...rest}>
        {children}
      </NextLink>
    );
  }
);

type NavLinkProps = LinkProps & {
  end?: boolean;
  className?:
    | string
    | ((args: { isActive: boolean; isPending: boolean }) => string);
  style?:
    | React.CSSProperties
    | ((args: { isActive: boolean; isPending: boolean }) => React.CSSProperties);
  activeClassName?: string;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink(
    { to, href: hrefProp, end, className, style, activeClassName, children, ...rest },
    ref
  ) {
    const pathname = usePathname() || "/";
    const href = toHref(to ?? hrefProp);
    const isActive = end
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

    const resolvedClassName =
      typeof className === "function"
        ? (className as any)({ isActive, isPending: false })
        : [className as string | undefined, isActive ? activeClassName : null]
            .filter(Boolean)
            .join(" ") || undefined;

    const resolvedStyle =
      typeof style === "function"
        ? (style as any)({ isActive, isPending: false })
        : (style as React.CSSProperties | undefined);

    return (
      <NextLink
        ref={ref}
        href={href}
        className={resolvedClassName}
        style={resolvedStyle}
        {...rest}
      >
        {children}
      </NextLink>
    );
  }
);

export type NavigateOptions = { replace?: boolean };
export type NavigateFn = (
  to: string | number,
  options?: NavigateOptions
) => void;

export const useNavigate = (): NavigateFn => {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
};

export const useParams = <T extends Record<string, string | string[] | undefined> = Record<string, string>>(): T => {
  return (nextUseParams() ?? {}) as T;
};

export const useLocation = () => {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const search = searchParams?.toString();
  return {
    pathname,
    search: search ? `?${search}` : "",
    hash: "",
    state: null as unknown,
    key: "default",
  };
};
