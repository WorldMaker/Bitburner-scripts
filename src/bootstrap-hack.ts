const app = 'base-hack.js'
const appRamCost = 2.4
const defaultBlacklist = ['home'] // don't hack home
let maxDepth = 2
let target: string = 'n00dles'

function deliverPayload(ns: NS, server: string) {
	if (!ns.hasRootAccess(server)) {
		return 0
	}
	if (ns.isRunning(app, server, target)) {
		return 1
	}
	const ram = ns.getServerMaxRam(server)
	ns.scp(app, server)
	ns.killall(server)
	ns.exec(app, server, Math.floor(ram / appRamCost), target)
	return 1
}

function hackServer(ns: NS, server: string) {
	if (!ns.hasRootAccess(server)) {
		return 1
	}
	const hackingLevel = ns.getHackingLevel()
	const serverLevel = ns.getServerRequiredHackingLevel(server)
	if (serverLevel <= hackingLevel) {
		// hack
		const ports = ns.getServerNumPortsRequired(server)
		switch (ports) {
			case 2:
				if (!ns.fileExists('FTPCrack.exe', 'home')) {
					return 0
				}
				ns.ftpcrack(server)
			// continue to case 1
			case 1:
				if (!ns.fileExists('BruteSSH.exe', 'home')) {
					return 0
				}
				ns.brutessh(server)
			// continue to case 0
			case 0:
				ns.nuke(server)
				break
			default:
				ns.tprint(`WARN ${server} needs ${ports} ports`)
				return 1
		}
	} else {
		ns.tprint(
			`WARN ${server} hacking level ${serverLevel} above ${hackingLevel}`
		)
	}
	return 0
}

function scanServers(ns: NS, hacked: Set<string>, server = 'home', depth = 0) {
	const servers = ns.scan(server)
	let count = 0
	for (const server of servers) {
		if (!hacked.has(server)) {
			count += hackServer(ns, server)
			hacked.add(server)

			if (depth < maxDepth) {
				count += scanServers(ns, hacked, server, depth + 1)
			}
		}
	}
	return count
}

export async function main(ns: NS) {
	target = ns.args[0]?.toString() ?? target
	maxDepth = Number(ns.args[1]) ?? maxDepth
	// hack current target first
	hackServer(ns, target)
	// hack the planet
	const hacked = new Set([...defaultBlacklist, target])
	const rooted = scanServers(ns, hacked)
	// deliver payloads to hacked machines
	let payloads = 0
	for (const server of hacked) {
		payloads += deliverPayload(ns, server)
	}
	ns.tprint(
		`INFO ${hacked.size} servers hacked; ${rooted} rooted, ${payloads} payloads`
	)
}
