// Test a single batch

import { ulid } from 'ulid'
import { createBatch, getBatchArgs, getNextBatchType } from './models/batch'
import { Logger } from './models/logger'
import { SimpleTarget, TargetDirection } from './models/target'

function getPayloadName(direction: TargetDirection) {
	switch (direction) {
		case 'grow':
			return 'payload-bg.js'
		case 'hack':
			return 'payload-bh.js'
		case 'weaken':
			return 'payload-bw.js'
	}
}

export async function main(ns: NS) {
	const command = ns.args[0].toString()
	if (command !== 'batch') {
		throw new Error(`Unknown command for payload '${command}'`)
	}
	const targetName = ns.args[1].toString()
	const target = new SimpleTarget(ns, targetName)
	const player = ns.getPlayer()
	const server = ns.getServer(targetName)
	const logger = new Logger(ns)

	const nextBatch = getNextBatchType(
		target,
		server.moneyAvailable,
		server.hackDifficulty
	)
	const batch = createBatch(ns, nextBatch, player, server)
	const plan = batch.plan(server.moneyAvailable, server.hackDifficulty)

	const planOverview = plan.plans
		.map((p) => `${p.direction} ${p.threads} @ ${p.start}`)
		.join(', ')

	logger.log(`INFO planned a ${nextBatch} batch with ${planOverview}`)

	const start = new Date(new Date().getTime() + 1000 /* ms */)
	for (const p of plan.plans) {
		ns.run(
			getPayloadName(p.direction),
			p.threads,
			'batch',
			targetName,
			...getBatchArgs(plan, start)
		)
	}

	const end = start.getTime() + plan.end
	await ns.sleep(Math.ceil(end - new Date().getTime()) + 1000 /* ms */)

	const moneyAvailable = target.checkMoneyAvailable()
	const securityLevel = target.checkSecurityLevel()
	if (moneyAvailable < target.getWorth()) {
		logger.log(`WARN money is not maximal after batch`)
	}
	if (securityLevel > target.getMinSecurityLevel()) {
		logger.log(`WARN security is higher than min after batch`)
	}
	if (
		moneyAvailable >= target.getWorth() &&
		securityLevel <= target.getMinSecurityLevel()
	) {
		logger.log(`SUCCESS batch was stable`)
	}
}
