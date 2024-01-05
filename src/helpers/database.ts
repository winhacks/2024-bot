import {PrismaClient} from "@prisma/client";
import {Discordify} from "../commands/team/team-shared";

const prisma = new PrismaClient();

export const GetStandardizedTeamName = (displayName: string): string => {
    return Discordify(displayName).toLowerCase();
};

export const GetHackerCount = async (
    includeUnverified: boolean = false
): Promise<number> => {
    if (includeUnverified) {
        return await prisma.hacker.count();
    }

    return await prisma.hacker.count({where: {verified: true}});
};

export const CreateHacker = async (
    discordId: string,
    firstName: string,
    lastName: string,
    email: string
) => {
    return await prisma.hacker.create({
        data: {discordId, firstName, lastName, email},
    });
};

export const GetHacker = async (discordId: string) => {
    return await prisma.hacker.findUnique({where: {discordId}});
};

export const IsHackerVerified = async (discordId: string): Promise<boolean> => {
    const hacker = await prisma.hacker.findUnique({where: {discordId}});
    return hacker?.verified ?? false;
};

export const IsEmailVerified = async (email: string): Promise<boolean> => {
    const hackerUsingEmail = await prisma.hacker.findFirst({where: {email}});
    return hackerUsingEmail !== null;
};

export const GetTeam = async (standardName: string) => {
    return await prisma.team.findUnique({where: {stdName: standardName}});
};

export const GetMembersOfTeam = async (standardName: string) => {
    return await prisma.hacker.findMany({where: {teamStdName: standardName}});
};

export const CreateTeam = async (
    displayName: string,
    categoryId: string,
    textChannelId: string,
    voiceChannelId: string
) => {
    try {
        const stdName = GetStandardizedTeamName(displayName);
        return await prisma.team.create({
            data: {stdName, displayName, categoryId, textChannelId, voiceChannelId},
        });
    } catch {
        return null;
    }
};

export const DeleteTeam = async (standardName: string) => {
    try {
        return await prisma.team.delete({where: {stdName: standardName}});
    } catch {
        return null;
    }
};

export const RemoveHackerFromTeam = async (discordId: string) => {
    try {
        return await prisma.hacker.update({
            where: {discordId},
            data: {teamStdName: null},
        });
    } catch {
        return null;
    }
};

export const UpsertInvite = async (inviteeId: string, teamStdName: string) => {
    try {
        return await prisma.invite.upsert({
            create: {teamStdName, inviteeId},
            update: {},
            where: {
                inviteeId_teamStdName: {inviteeId, teamStdName},
            },
        });
    } catch {
        return null;
    }
};

export const GethackerInvites = async (discordId: string) => {
    return await prisma.invite.findMany({where: {inviteeId: discordId}});
};

export const GethackerTeam = async (discordId: string) => {
    const hacker = await GetHacker(discordId);
    if (!hacker?.teamStdName) {
        return null;
    }

    return await GetTeam(hacker.teamStdName);
};

export const SetHackerVerified = async (discordId: string, verified: boolean) => {
    if (verified) {
        return await prisma.hacker.update({
            where: {discordId},
            data: {verified: true, verifiedAt: new Date()},
        });
    } else {
        return await prisma.hacker.update({
            where: {discordId},
            data: {verified: false},
        });
    }
};

export const CreateCategory = async (id: string) => {
    return await prisma.discordCategory.create({data: {categoryId: id}});
};

export const GetAllCategories = async () => {
    return await prisma.discordCategory.findMany({
        include: {
            _count: {
                select: {
                    teams: true,
                },
            },
        },
    });
};

export const WithTransaction = (callback: () => Promise<boolean>) => {
    return prisma.$transaction(async (tx) => {
        const result = await callback();
        if (!result) {
            const up = Error("aborting transaction");
            throw up;
        }
    });
};
