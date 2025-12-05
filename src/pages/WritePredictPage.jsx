import WriteAndPredict from "../components/WriteAndPredict";

export default function WritePredictPage() {
  return (
    <div className="pt-24 md:pt-28"> {/* prevents navbar overlap */}
      <WriteAndPredict />
    </div>
  );
}
