import { B, ExtLink, H1, I, P } from '~/components/article'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-white bg-slate-800 py-4 px-6">
        <span className="text-2xl font-semibold">
          <a href="/">Donglotin</a>
        </span>
      </div>

      <div className="flex-grow h-full p-8 text-white bg-slate-700">
        <div className="max-w-[78vw] mx-auto">
          <div className="font-medium text-3xl text-center mt-8 mb-10">Download Facebook Videos</div>
          <div className="flex justify-center mb-8">
            <input className="w-full p-4 bg-transparent border border-slate-400 rounded-2xl" placeholder="Paste the video url here" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-block px-6 py-4 bg-slate-500 rounded-2xl">
              <span className="text-xl font-medium">Download</span>
            </div>
          </div>

          <div className="bg-slate-800 flex items-center px-8 py-4 rounded-2xl">
            <div className="flex-grow text-xl">{('title very long abcdefghijklmnopqrstuvwxyz').substring(0, 30)}...</div>
            <div className="flex gap-x-4">
              <a href="" className="bg-slate-500 px-4 py-3 rounded-2xl">Download HD</a>
              <a href="" className="bg-slate-500 px-4 py-3 rounded-2xl">Download</a>
            </div>
          </div>
        </div>
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
