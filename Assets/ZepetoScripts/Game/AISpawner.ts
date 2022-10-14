import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine";
import { Random, Vector3 } from 'UnityEngine';

export default class AISpawner extends ZepetoScriptBehaviour {

    Start() {
        for (let i = 0; i < 10; i++) {
            this.SpawnAI(i);
        }
    }
    private SpawnAI(i:number) {
        const spawnInfo = new SpawnInfo();
        const position = this.ParseVector3(new Vector3(Random.Range(-25, 25), 0, Random.Range(-25, 25)));
        const rotation = this.ParseVector3(new Vector3(0, Random.Range(-180, 180),0));
        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);
        ZepetoPlayers.instance.CreatePlayerWithUserId("ai" + i.toString(), "", spawnInfo, false);
        ZepetoPlayers.instance.name
    }
    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
            (
                vector3.x,
                vector3.y,
                vector3.z
            );
    }
}