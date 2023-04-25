import { H1, P, BR, H2, ExtLink, Link } from "~/components/article";

export default function PP() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-white bg-slate-800 py-4 px-6">
        <span className="text-2xl font-semibold">
          <a href="/">Donglotin</a>
        </span>
      </div>
      <div className="flex-grow p-8 text-white bg-slate-700">
        <H1>Privacy Policy</H1>
        <P>This Privacy Policy describes the manner in which Donglotin collects, use and discloses information collected from users (each, a "User") of the https://donglotin.rzfury.dev/ website ("Site") </P>

        <BR />
        <H2>Non-personal identification information</H2>
        <P>We may collect non-personal identification information about Users whenever they interact with our Site using Google Analytics. Non-personal identification information may include the browser name, the type of computer and technical information about Users means of connection to our Site, such as the operating system and the Internet service providers utilized and other similar information.</P>

        <BR />
        <H2>Web browser cookies</H2>
        <P>Our Site may use "cookies" to enhance User experience. User's web browser places cookies on their hard drive for record-keeping purposes and sometimes to track information about them. User may choose to set their web browser to refuse cookies, or to alert you when cookies are being sent. If they do so, note that some parts of the Site may not function properly.</P>

        <BR />
        <H2>How we use collected information</H2>
        <P>Donglotin may collect and use Users personal information for the following purposes:</P>
        <ul>
          <li>
            <div>
              <div className="font-semibold">To run and operate our Site</div>
              <div className="">We may need your information display content on the Site correctly.</div>
            </div>
          </li>
          <li>
            <div>
              <div className="font-semibold">To improve customer service</div>
              <div className="">Information you provide helps us respond to your customer service requests and support needs more efficiently.</div>
            </div>
          </li>
          <li>
            <div>
              <div className="font-semibold">To improve our Site</div>
              <div className="">We may use feedback you provide to improve our products and services.</div>
            </div>
          </li>
        </ul>

        <BR />
        <H2>Your acceptance of these terms</H2>
        <P>By using this Site, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our Site. Your continued use of the Site following the posting of changes to this policy will be deemed your acceptance of those changes.</P>

        <BR />
        <H2>Contacting Us</H2>
        <P>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please <ExtLink href="mailto:rzfury90@gmail.com?subject=Donglotin">Contact Us.</ExtLink></P>

        <BR />
      </div>

      <div className="text-white bg-slate-800 py-4 px-6">
        <div className="text-center mb-4">
          Donglotin does not host any pirated or copyrighted content on its server, and all the videos that you download are downloaded to your system directly from their respective CDN servers.
        </div>
        <div className="text-center">&copy; Donglotin 2023. All Rights Reserved. <Link href="/privacy-policy">Privacy Policy</Link></div>
      </div>
    </div>
  )
}
