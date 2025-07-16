-- CreateTable
CREATE TABLE "PreferredStudyTime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "PreferredStudyTime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PreferredStudyTime" ADD CONSTRAINT "PreferredStudyTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
