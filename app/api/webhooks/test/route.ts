import { NextResponse } from "next/server";


// test route for testing webhook
export async function POST (req: NextResponse) {
    try {
        const data = await req.json()
        console.log(data);
        
        return NextResponse.json({data})
        
    } catch (error) {
        console.log(error);
        
    }
} 