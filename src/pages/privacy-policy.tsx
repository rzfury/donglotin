import { PropsWithChildren } from "react";

export default function PP() {
  const BR = () => {
    return <br className="mb-8" />
  }

  const H1 = (props: PropsWithChildren) => {
    return <h1 className="text-4xl font-semibold mb-8">{props.children}</h1>
  }

  const H1B = (props: PropsWithChildren) => {
    return <h1 className="text-4xl font-bold mb-8">{props.children}</h1>
  }

  const H2 = (props: PropsWithChildren) => {
    return <h2 className="text-2xl font-semibold mb-4">{props.children}</h2>
  }

  const H3 = (props: PropsWithChildren) => {
    return <h3 className="text-xl font-semibold mb-4">{props.children}</h3>
  }

  const ExtLink = (props: PropsWithChildren<{ href: string }>) => {
    return <a href={props.href} className="active:text-purple-700 hover:text-blue-800 text-blue-500" target="_blank" referrerPolicy="no-referrer" rel="noopener noreferrer">{props.children}</a>
  }

  const P = (props: PropsWithChildren) => {
    return <p className="mb-4">{props.children}</p>
  }

  return (
    <div className="p-4">

      <H1B>Privacy Policy</H1B>
      <P>Last updated: April 25, 2023</P>
      <P>This Privacy Policy describes the manner in which Donglotin collects, use and discloses information collected from users (each, a "User") of the https://donglotin.rzfury.dev/ website ("Site") </P>

      <H1>Non-personal identification information</H1>
      <P>We may collect non-personal identification information about Users whenever they interact with our Site using Google Analytics. Non-personal identification information may include the browser name, the type of computer and technical information about Users means of connection to our Site, such as the operating system and the Internet service providers utilized and other similar information.</P>

      <H1>Web browser cookies</H1>
      <P>Our Site may use "cookies" to enhance User experience. User's web browser places cookies on their hard drive for record-keeping purposes and sometimes to track information about them. User may choose to set their web browser to refuse cookies, or to alert you when cookies are being sent. If they do so, note that some parts of the Site may not function properly.</P>
      
      <H1>How we use collected information</H1>
      <P>Twitter Video Downloader may collect and use Users personal information for the following purposes:</P>
      <ul>
        <li>To run and operate our Site We may need your information display content on the Site correctly.</li>
        <li>To improve customer service Information you provide helps us respond to your customer service requests and support needs more efficiently.</li>
        <li>To improve our Site We may use feedback you provide to improve our products and services.</li>
      </ul>

      <H1>Your acceptance of these terms</H1>
      <P>By using this Site, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our Site. Your continued use of the Site following the posting of changes to this policy will be deemed your acceptance of those changes.</P>

      <H1>Contacting Us</H1>
      <P>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please <ExtLink href="mailto:rzfury90@gmail.com?subject=Donglotin">Contact Us.</ExtLink></P>
    </div>
  )
}
