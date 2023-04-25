import { PropsWithChildren } from "react"

export const BR = () => {
  return <br className="mb-8" />
}

export const H1 = (props: PropsWithChildren) => {
  return <h1 className="text-4xl font-semibold mb-6">{props.children}</h1>
}

export const H1B = (props: PropsWithChildren) => {
  return <h1 className="text-4xl font-bold mb-6">{props.children}</h1>
}

export const H2 = (props: PropsWithChildren) => {
  return <h2 className="text-2xl font-semibold mb-4">{props.children}</h2>
}

export const H3 = (props: PropsWithChildren) => {
  return <h3 className="text-xl font-semibold mb-4">{props.children}</h3>
}

export const Link = (props: PropsWithChildren<{ href: string }>) => {
  return <a href={props.href} className="underline">{props.children}</a>
}

export const ExtLink = (props: PropsWithChildren<{ href: string }>) => {
  return <a href={props.href} className="underline" target="_blank" referrerPolicy="no-referrer" rel="noopener noreferrer">{props.children}</a>
}

export const P = (props: PropsWithChildren) => {
  return <p className="mb-4">{props.children}</p>
}

export const B = (props: PropsWithChildren) => {
  return <strong className="font-bold">{props.children}</strong>
}

export const I = (props: PropsWithChildren) => {
  return <i className="italic">{props.children}</i>
}
