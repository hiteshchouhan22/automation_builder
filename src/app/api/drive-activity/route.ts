import { google } from "googleapis"
import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db"

export async function GET() {
  const oauth2client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ message: "User not found" })
  }

  const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
    userId,
    "oauth_google"
  )

  const accessToken = clerkResponse[0].token
  oauth2client.setCredentials({
    access_token: accessToken,
  })

  const drive = google.drive({
    version: "v3",
    auth: oauth2client,
  })

  const channelId = uuidv4()

  const startPageTokenRes = await drive.changes.getStartPageToken({})
  const startPageToken = startPageTokenRes.data.startPageToken
  if (startPageToken == null) {
    throw new Error("startPageToken is unexpectedly null")
  }

  const listener = await drive.changes.watch({
    pageToken: startPageToken,
    supportsAllDrives: true,
    supportsTeamDrives: true,
    requestBody: {
      id: channelId,
      type: "web_hook",

      // need to change while hosting on prod currently working on web hook need to update on clerk side too with url on hosting url
      address: `${process.env.NGROK_URI}/api/drive-activity/notification`,
      kind: "api#channel",
    },
  })

  if (listener.status == 200) {
    //if listener created store its channel id in db
    const channelStored = await db.user.updateMany({
      where: {
        clerkId: userId,
      },
      data: {
        googleResourceId: listener.data.resourceId,
      },
    })

    if (channelStored) {
      return new NextResponse("Listen to changes....")
    }
  }

  return new NextResponse("Oops! somthing went wrong, try again!")
}
