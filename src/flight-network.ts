import { param } from "express-validator";

export interface Graph {
    [key: string]: { [key: string]: number }
};

export interface Airport {
    lat: number;
    lng: number;
    iata: string,
    icao: string
}

type PathGraph = { [key: string]: { code: string, level: number, isFlight: boolean } | undefined };
export type Params = {
    startCode: string;
    destCode: string;
    maxLegs?: number;
    checkPerimeter?: boolean
}

export class FlightNetwork {
    constructor(
        private airports: Airport[],
        private routesGraph: Graph,
        private nearestAirportsGraph: Graph) {
    }

    shortestRoute(params: Params): string {
        let { startCode, destCode, maxLegs = 4, checkPerimeter = false } = params;
        if (startCode.length === 4) {
            startCode = this.airports.find(airport => airport.icao === startCode)?.iata as string;
        }
        if (destCode.length === 4) {
            destCode = this.airports.find(airport => airport.icao === destCode)?.iata as string;
        }

        const queue = new PriorityQueue();
        const previous: PathGraph = {};

        for (const airport of this.airports) {
            previous[airport.iata] = undefined;
            queue.enqueue({ value: airport.iata, priority: Infinity })
        }
        queue.decreaseKey({ value: startCode, priority: 0 });
        previous[startCode] = { code: '', level: 0, isFlight: true };

        while (queue.size()) {
            let { value: nearestCode, priority: nearestDistance } = queue.dequeue() as Node;

            if (nearestCode === destCode) break;
            if (previous[nearestCode]?.level === maxLegs) continue;

            for (const code in this.routesGraph[nearestCode]) {
                if (!queue.has(code)) continue;
                const d = nearestDistance + this.routesGraph[nearestCode][code];
                if (d < queue.getPriority(code)) {
                    queue.decreaseKey({ value: code, priority: d });
                    previous[code] = {
                        code: nearestCode,
                        level: previous[nearestCode]?.level as number + 1,
                        isFlight: true
                    };
                }
            }

            /** prevent change via ground for the first leg */
            if (!checkPerimeter || nearestCode === startCode) continue;

            for (const code in this.nearestAirportsGraph[nearestCode]) {
                /** prevent change via ground for the last leg */
                if (!queue.has(code) || code === destCode) continue;
                const d = nearestDistance + this.nearestAirportsGraph[nearestCode][code];
                if (d < queue.getPriority(code)) {
                    queue.decreaseKey({ value: code, priority: d });
                    previous[code] = {
                        code: nearestCode,
                        level: previous[nearestCode]?.level as number,
                        isFlight: false
                    };
                }
            }
        }

        return this.extractPath(previous, destCode);
    }

    private extractPath(previous: PathGraph, destCode: string) {
        let route = '';
        let code: string | undefined = destCode;
        let isFlight: boolean | undefined = true;
        while (code) {
            const delimiter = isFlight ? '->' : '=>';
            route = code + (route ? delimiter : '') + route;
            const node: PathGraph[string] = previous[code];
            code = node?.code
            isFlight = node?.isFlight;
        }

        return route.includes('->') ? route : 'No route.';
    }
}

interface Node {
    value: string;
    priority: number
};

class PriorityQueue {
    private data: Array<Node> = [];
    private indexMap = new Map<string, number>();

    public enqueue(node: Node) {
        this.data.push(node);
        const idx = this.data.length - 1;
        this.indexMap.set(node.value, idx);
        this.bubleUp(idx);
    }

    public has(value: string) {
        return this.indexMap.has(value);
    }

    public getPriority(value: string) {
        return this.data[this.indexMap.get(value) as number].priority;
    }

    public dequeue(): Node | null {
        if (this.data.length < 2) return this.data?.[0];

        this.swap(0, this.data.length - 1);
        const min = this.data.pop() as Node;
        this.indexMap.delete(min.value);
        this.bubleDown(0);

        return min;
    }

    public decreaseKey(node: Node) {
        const idx = this.indexMap.get(node.value) as number;
        this.data[idx] = node;
        this.bubleUp(idx);
    }

    public size() {
        return this.data.length;
    }

    private bubleUp(idx: number) {
        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            if (this.data[parentIdx].priority <= this.data[idx].priority) break;
            this.swap(parentIdx, idx);
            idx = parentIdx;
        }
    }

    private bubleDown(idx: number) {
        while (true) {
            const leftChildIdx = 2 * idx + 1;
            const rightChildIdx = 2 * idx + 2;
            const leftChild = this.data[leftChildIdx];
            const rightChild = this.data[rightChildIdx];
            let childIndex;

            if (!leftChild && !rightChild) break;

            if (!leftChild || !rightChild) {
                childIndex = leftChild ? leftChildIdx : rightChildIdx;
            }

            if (!childIndex) {
                childIndex = leftChild.priority < rightChild.priority ? leftChildIdx : rightChildIdx;
            }

            if (this.data[idx].priority <= this.data[childIndex].priority) break;

            this.swap(idx, childIndex);
            idx = childIndex;
        }
    }

    private swap(idx1: number, idx2: number) {
        const node1 = this.data[idx1];
        const node2 = this.data[idx2];
        [this.data[idx1], this.data[idx2]] = [node2, node1];
        this.indexMap.set(node1.value, idx2);
        this.indexMap.set(node2.value, idx1);
    }
}