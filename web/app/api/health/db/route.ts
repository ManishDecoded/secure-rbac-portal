import { withOracleConnection } from "@/lib/db";

export async function GET() {
  try {
    const message = await withOracleConnection(async (connection) => {
      const result = await connection.execute(
        "SELECT 'Next.js connected to Oracle!' AS MESSAGE FROM DUAL"
      );

      const row = result.rows?.[0] as string[] | undefined;

      if (!row) {
        throw new Error("Oracle returned no result.");
      }

      return row[0];
    });

    return Response.json({
      success: true,
      message,
    });
  } catch (error) {
    // Detailed error appears in the VS Code terminal.
    console.error("Oracle connection error:", error);

    return Response.json(
      {
        success: false,
        message: "Could not connect to Oracle Database.",
      },
      { status: 500 }
    );
  }
}