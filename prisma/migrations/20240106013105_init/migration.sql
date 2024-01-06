-- CreateTable
CREATE TABLE "Team" (
    "stdName" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "textChannelId" TEXT NOT NULL,
    "voiceChannelId" TEXT NOT NULL,
    CONSTRAINT "Team_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DiscordCategory" ("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "discordId" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "teamStdName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    CONSTRAINT "User_teamStdName_fkey" FOREIGN KEY ("teamStdName") REFERENCES "Team" ("stdName") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invite" (
    "inviteeId" TEXT NOT NULL,
    "teamStdName" TEXT NOT NULL,

    PRIMARY KEY ("inviteeId", "teamStdName"),
    CONSTRAINT "Invite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_teamStdName_fkey" FOREIGN KEY ("teamStdName") REFERENCES "Team" ("stdName") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscordCategory" (
    "categoryId" TEXT NOT NULL PRIMARY KEY
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_stdName_key" ON "Team"("stdName");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_inviteeId_teamStdName_key" ON "Invite"("inviteeId", "teamStdName");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordCategory_categoryId_key" ON "DiscordCategory"("categoryId");
