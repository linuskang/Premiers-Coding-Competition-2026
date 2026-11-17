//   ______                                 __
//  /      \                               /  |
// /$$$$$$  | __    __   ______    _______ $$ |   __  __    __
// $$ |  $$ |/  |  /  | /      \  /       |$$ |  /  |/  |  /  |
// $$ |  $$ |$$ |  $$ | $$$$$$  |/$$$$$$$/ $$ |_/$$/ $$ |  $$ |
// $$ |_ $$ |$$ |  $$ | /    $$ |$$ |      $$   $$<  $$ |  $$ |
// $$ / \$$ |$$ \__$$ |/$$$$$$$ |$$ \_____ $$$$$$  \ $$ \__$$ |
// $$ $$ $$< $$    $$/ $$    $$ |$$       |$$ | $$  |$$    $$ |
//  $$$$$$  | $$$$$$/   $$$$$$$/  $$$$$$$/ $$/   $$/  $$$$$$$ |
//      $$$/                                         /  \__$$ |
//                                                   $$    $$/
//                                                    $$$$$$/
//
// Linus Kang, 2026
// Work is licensed under the CC BY-NC 4.0 license.

import { redirect } from "next/navigation"
import { getSession } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { RngCard } from "./rng-card"

function todayDate() {
    const now = new Date()
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
}

async function getRank(number: number, date: Date) {
    const higher = await prisma.rngEntry.count({
        where: {
            date,
            number: {
                gt: number,
            },
        },
    })
    return higher + 1
}

export default async function Page() {
    const session = await getSession()

    if (!session) {
        redirect("/auth/login")
    }

    const date = todayDate()

    const todayEntry = await prisma.rngEntry.findUnique({
        where: {
            userId_date: {
                userId: session.user.id,
                date,
            },
        },
    })

    const rank = todayEntry ? await getRank(todayEntry.number, date) : null

    const [entries, total] = await Promise.all([
        prisma.rngEntry.findMany({
            where: { date },
            orderBy: { number: "desc" },
            take: 10,
            select: {
                number: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
        }),
        prisma.rngEntry.count({
            where: { date },
        }),
    ])

    return (
        <RngCard
            initialEntry={{
                number: todayEntry?.number ?? null,
                rank,
                hasRolled: !!todayEntry,
            }}
            initialLeaderboard={{
                total,
                entries,
            }}
        />
    )
}
