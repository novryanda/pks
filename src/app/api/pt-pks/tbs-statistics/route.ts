import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { getJakartaDateKey, parseJakartaDateBoundary } from "@/lib/date-time";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");
    const startDateStr = searchParams.get("startDate"); // Format: YYYY-MM-DD
    const endDateStr = searchParams.get("endDate"); // Format: YYYY-MM-DD
    // Legacy support for old single date/month params
    const date = searchParams.get("date"); // Format: YYYY-MM-DD
    const month = searchParams.get("month"); // Format: YYYY-MM

    if (!materialId) {
      return NextResponse.json(
        { error: "materialId is required" },
        { status: 400 }
      );
    }

    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      // New date range mode
      startDate = parseJakartaDateBoundary(startDateStr) ?? new Date(startDateStr);
      endDate = parseJakartaDateBoundary(endDateStr, { endOfDay: true }) ?? new Date(endDateStr);
    } else if (date) {
      // Legacy single date mode
      startDate = parseJakartaDateBoundary(date) ?? new Date(date);
      endDate = parseJakartaDateBoundary(date, { endOfDay: true }) ?? new Date(date);
    } else if (month) {
      // Legacy month mode
      const [year, m] = month.split("-").map(Number);
      const monthStartKey = `${year}-${String(m).padStart(2, "0")}-01`;
      startDate = parseJakartaDateBoundary(monthStartKey) ?? new Date(year!, m! - 1, 1, 0, 0, 0);
      const todayKey = getJakartaDateKey(new Date());
      const [currentYear, currentMonth] = todayKey?.split("-").map(Number) ?? [];
      if (year === currentYear && m === currentMonth) {
        endDate = parseJakartaDateBoundary(todayKey!, { endOfDay: true }) ?? new Date();
      } else {
        const monthEndKey = `${year}-${String(m).padStart(2, "0")}-${String(new Date(year!, m!, 0).getDate()).padStart(2, "0")}`;
        endDate = parseJakartaDateBoundary(monthEndKey, { endOfDay: true }) ?? new Date(year!, m!, 0, 23, 59, 59, 999);
      }
    } else {
      // Default to today
      const todayKey = getJakartaDateKey(new Date());
      startDate = parseJakartaDateBoundary(todayKey!) ?? new Date();
      endDate = parseJakartaDateBoundary(todayKey!, { endOfDay: true }) ?? new Date();
    }

    const statistics = await penerimaanTBSService.getTBSStatistics(
      session.user.company.id,
      materialId,
      { startDate, endDate }
    );
    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching TBS statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch TBS statistics" },
      { status: 500 }
    );
  }
}
