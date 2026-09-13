import type { Metadata } from "next";
import {
  buildPumpFamilyHubMetadata,
  PumpFamilyHubPage,
} from "@/components/pumps/PumpFamilyHub";

export const revalidate = false;

export const metadata: Metadata = buildPumpFamilyHubMetadata("tpv");

export default function CirkulyacionnyeNasosyTpvPage() {
  return <PumpFamilyHubPage kind="tpv" />;
}
