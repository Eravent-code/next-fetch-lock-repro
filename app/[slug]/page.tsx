import type { Metadata } from "next";
import { notFound } from "next/navigation";

// In the real app this was `${process.env.API_URL}/posts/${slug}` with API_URL
// unset, i.e. "undefined/posts/<slug>". Any URL that `new Request()` rejects
// triggers the bug.
const API_URL = "not-a-url";

async function getPost(slug: string): Promise<{ title: string } | null> {
  try {
    const res = await fetch(`${API_URL}/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : null;
  } catch (error) {
    // Expected: TypeError: Failed to parse URL from not-a-url/posts/<slug>
    console.error("getPost failed:", (error as Error).message);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post?.title ?? "Not found" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <h1>{post.title}</h1>;
}
