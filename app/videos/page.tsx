import { getVideoSessions } from "@/lib/queries";
import VideoView from "@/components/VideoView";

export default async function VideosPage() {
  const videos = await getVideoSessions();
  return <VideoView initialVideos={videos} />;
}
