import Image from "next/image";

export const dynamic = "force-static";

const Wave = () => {
  return (
    <div className="w-full">
      <Image
        alt="wave"
        src="/images/wave.jpeg"
        width={0}
        height={0}
        sizes="90vw"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
};
export default Wave;
