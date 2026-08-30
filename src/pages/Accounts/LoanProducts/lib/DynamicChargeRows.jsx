import DynamicChargePicker from "../../lib/DynamicChargePicker";

export default function DynamicChargeRows({ rows, onChange }) {
  return <DynamicChargePicker value={rows} onChange={onChange} />;
}
