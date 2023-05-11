import { Company } from '../../models/corporation'
import { MaterialRound0Manager } from './material-round-0'
import { MaterialRound1Manager } from './material-round-1'
import { MaterialRound2Manager } from './material-round-2'
import { ProductRound2Manager } from './product-round-2'
import { ProductRound3Manager } from './product-round-3'
import { ProductRound4Manager } from './product-round-4'
import { UnstartedPhaseManager } from './unstarted'
import { NsContext } from '../../models/context'

export interface PhaseManager {
	summarize(): string | void
	manage(): Promise<void>
}

export function getPhaseManager(context: NsContext, company: Company) {
	switch (company.getState()) {
		case 'Unstarted':
			return new UnstartedPhaseManager(context, company)
		case 'Material0Round':
			return new MaterialRound0Manager(context, company)
		case 'Material1Round':
			return new MaterialRound1Manager(context, company)
		case 'Material2Round':
			return new MaterialRound2Manager(context, company)
		case 'Product2Round':
			return new ProductRound2Manager(context, company)
		case 'Product3Round':
			return new ProductRound3Manager(context, company)
		case 'Product4Round':
			return new ProductRound4Manager(context, company)
	}
}
