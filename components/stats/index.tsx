import Clicks from "@/components/stats/clicks";
import Devices from "@/components/stats/devices";
import Feedback from "@/components/stats/feedback";
import Locations from "@/components/stats/locations";
import Referer from "@/components/stats/referer";
import Toggle from "@/components/stats/toggle";

export default function Stats({
  atModalTop,
  staticDomain,
}: {
  atModalTop?: boolean;
  staticDomain?: string;
}) {
  return (
    <div className="bg-gray-50 py-10">
      <Toggle atModalTop={atModalTop} staticDomain={staticDomain} />
      <div className="mx-auto grid max-w-4xl gap-5">
        <Clicks />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Locations />
          <Devices />
          <Referer />
          <Feedback />
        </div>
      </div>
    </div>
  );
}
