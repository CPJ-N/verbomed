import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-[#122f3b] text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center space-x-6">
          <a
            href="https://github.com/CPJ-N"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
          >
            <Image
              src="/github-logo.svg"
              alt="GitHub"
              width={24}
              height={24}
              className="text-stone-100"
            />
          </a>
          <a
            href="https://www.linkedin.com/in/charles-nischal-745aaa148"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
          >
            <Image
              src="/linkedin-logo.svg"
              alt="LinkedIn"
              width={24}
              height={24}
              className="text-stone-100"
            />
          </a>
          <a
            href="https://twitter.com/dillikahoon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
          >
            <Image
              src="/x-logo.svg"
              alt="X (formerly Twitter)"
              width={24}
              height={24}
              className="text-stone-100"
            />
          </a>
        </div>
        <div className="text-center mt-4 text-sm text-gray-400">
          © {new Date().getFullYear()} Verbomed. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
