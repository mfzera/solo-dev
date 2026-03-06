import { getArchivedTasks } from "@/lib/queries";
import ArchiveClient from "@/components/ArchiveClient";

export default async function ArchivePage() {
  const tasks = await getArchivedTasks();
  return <ArchiveClient tasks={tasks} />;
}
