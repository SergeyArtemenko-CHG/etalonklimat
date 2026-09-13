import type { Metadata } from "next";
import {
  buildPumpFamilyHubMetadata,
  PumpFamilyHubPage,
} from "@/components/pumps/PumpFamilyHub";

export const revalidate = false;

export const metadata: Metadata = buildPumpFamilyHubMetadata("crv");

export default function VertikalnyeNasosyCrvPage() {
  return <PumpFamilyHubPage kind="crv" />;
}
