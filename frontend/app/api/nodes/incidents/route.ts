import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("http://backend:8080/api/incidents", { cache: 'no-store' });
    if (!res.ok) throw new Error("Backend responded with an error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}