import Link from "next/link";
import Image from "next/image";
import { SidebarNav } from "./SidebarNav";

// Server component: the name header is static; only the nav needs the client
// (pathname active state, hover tooltips, dice spin).
export function Sidebar() {
  return (
    <>
      {/* Name section */}
      <div className="flex flex-col items-center mb-2 lg:fixed lg:top-10 lg:left-10 lg:mb-2">
        <div className="font-bold text-center lg:text-left mt-4 mb-2 lg:mt-0">
          <div className="flex flex-row lg:flex-col items-center justify-center lg:justify-start gap-2">
            <Link href="/">
              <Image
                src="/icons/ename.svg"
                alt="BENEDICT NEO"
                width={10}
                height={10}
                className="w-24 lg:w-28 h-auto dark:invert"
                priority
              />
            </Link>
            <Link href="/about">
              <Image
                src="/icons/cname.svg"
                alt="梁耀恩"
                width={10}
                height={10}
                className="w-24 lg:w-28 h-auto dark:invert"
                priority
              />
            </Link>
          </div>
        </div>
      </div>

      <SidebarNav />
    </>
  );
}
