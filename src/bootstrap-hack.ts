const app = 'base-hack.js'
const appRamCost = 2.4
const defaultBlacklist = ['home'] // don't hack home
let maxDepth = 2
let target: string = 'n00dles'

function deliverPayload(ns: NS, server: string) {
	const ram = ns.getServerMaxRam(server)
	ns.scp(app, server)
	ns.killall(server)
	ns.exec(app, server, Math.floor(ram / appRamCost), target)
}

function hackServer(ns: NS, server: string) {
	if (ns.hasRootAccess(server)) {
		deliverPayload(ns, server)
		return
	}

	const hackingLevel = ns.getHackingLevel()
	const serverLevel = ns.getServerRequiredHackingLevel(server)
	if (serverLevel < hackingLevel) {
		// hack
		const ports = ns.getServerNumPortsRequired(server)
		switch (ports) {
			case 2:
				if (!ns.fileExists('FTPCrack.exe', 'home')) {
					return
				}
				ns.ftpcrack(server)
			// continue to case 1
			case 1:
				if (!ns.fileExists('BruteSSH.exe', 'home')) {
					return
				}
				ns.brutessh(server)
			// continue to case 0
			case 0:
				ns.nuke(server)
				break
			default:
				ns.print(`WARN ${server} needs ${ports} ports`)
				return
		}
		deliverPayload(ns, server)
	} else {
		ns.print(
			`WARN ${server} hacking level ${serverLevel} above ${hackingLevel}`
		)
	}
}

function scanServers(ns: NS, hacked: Set<string>, server = 'home', depth = 0) {
	const servers = ns.scan(server)
	for (const server of servers) {
		if (!hacked.has(server)) {
			hackServer(ns, server)
			hacked.add(server)

			if (depth < maxDepth) {
				scanServers(ns, hacked, server, depth + 1)
			}
		}
	}
}

export async function main(ns: NS) {
	target = ns.args[0].toString() ?? target
	maxDepth = Number(ns.args[1]) ?? maxDepth
	// hack current target first
	hackServer(ns, target)
	// hack the planet
	const hacked = new Set([...defaultBlacklist, target])
	scanServers(ns, hacked)
}
