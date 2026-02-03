export function ScallopHeader() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Main header background */}
      <div className="bg-header-bg h-8 md:h-10" />
      
      {/* Scallop pattern */}
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-4 md:h-5 translate-y-[95%]"
      >
        <path
          d="M0,10 C5,0 10,0 15,10 C20,0 25,0 30,10 C35,0 40,0 45,10 C50,0 55,0 60,10 C65,0 70,0 75,10 C80,0 85,0 90,10 C95,0 100,0 100,10 L100,0 L0,0 Z"
          className="fill-header-bg"
        />
      </svg>
    </div>
  );
}
