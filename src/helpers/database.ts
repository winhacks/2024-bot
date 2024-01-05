import {PrismaClient} from "@prisma/client";
import {Discordify} from "../commands/team/team-shared";

const prisma = new PrismaClient();

export const GetStandardizedTeamName = (displayName: string): string => {
    return Discordify(displayName).toLowerCase();
};

export const GetUserCount = async (
    includeUnverified: boolean = false
): Promise<number> => {
    if (includeUnverified) {
        return await prisma.user.count();
    }

    return await prisma.user.count({where: {verified: true}});
};

export const CreateUser = async (
    discordId: string,
    firstName: string,
    lastName: string,
    email: string
) => {
    return await prisma.user.create({
        data: {discordId, firstName, lastName, email},
    });
};

export const GetUser = async (discordId: string) => {
    return await prisma.user.findUnique({where: {discordId}});
};

export const IsUserVerified = async (discordId: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({where: {discordId}});
    return user?.verified ?? false;
};

export const IsEmailVerified = async (email: string): Promise<boolean> => {
    const userUsingEmail = await prisma.user.findFirst({where: {email}});
    return userUsingEmail !== null;
};

export const GetTeam = async (standardName: string) => {
    return await prisma.team.findUnique({where: {stdName: standardName}});
};

export const GetMembersOfTeam = async (standardName: string) => {
    return await prisma.user.findMany({where: {teamStdName: standardName}});
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

export const RemoveUserFromTeam = async (discordId: string) => {
    try {
        return await prisma.user.update({
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

export const GetUserInvites = async (discordId: string) => {
    return await prisma.invite.findMany({where: {inviteeId: discordId}});
};

export const GetUserTeam = async (discordId: string) => {
    const user = await GetUser(discordId);
    if (!user?.teamStdName) {
        return null;
    }

    return await GetTeam(user.teamStdName);
};

export const SetUserVerified = async (discordId: string, verified: boolean) => {
    if (verified) {
        return await prisma.user.update({
            where: {discordId},
            data: {verified: true, verifiedAt: new Date()},
        });
    } else {
        return await prisma.user.update({
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
