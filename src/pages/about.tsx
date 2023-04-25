import { H1, P, ExtLink, B, I } from "~/components/article";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-white bg-slate-800 py-4 px-6">
        <span className="text-2xl font-semibold">
          <a href="/">Donglotin</a>
        </span>
      </div>
      
      <div className="flex-grow h-full p-8 text-white bg-slate-700">
        <H1>About</H1>
        <P><B>Donglotin</B> is an online tool which you can use to download videos from Facebook. It downloads any twitter video directly to your device. However there are few protected posts which can only be seen to some users if they are logged in, and since Donglotin do not have access to those posts, it can not download videos embedded in those posts.</P>
        <P><I>We do not host any copy right content on our server, user downloads all the videos & gifs directly from their respective CDN servers.</I></P>
      </div>

      <div className="text-white bg-slate-800 py-4 px-6">
        <div className="text-center mb-4">
          Donglotin does not host any pirated or copyrighted content on its server, and all the videos that you download are downloaded to your system directly from their respective CDN servers.
        </div>
        <div className="text-center">&copy; Donglotin 2023. All Rights Reserved. <ExtLink href="/privacy-policy">Privacy Policy</ExtLink></div>
      </div>
    </div>
  )
}
