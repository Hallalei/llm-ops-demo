import { DatasetsTable } from "./_components/datasets-table";
import { getDatasets } from "./lib/queries";

export default async function DatasetsPage() {
  const datasets = await getDatasets();

  return (
    <div className="container max-w-6xl py-8">
      <DatasetsTable datasets={datasets} />
    </div>
  );
}
