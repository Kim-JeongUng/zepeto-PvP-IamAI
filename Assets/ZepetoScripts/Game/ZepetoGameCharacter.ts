import {Transform, ControllerColliderHit, GameObject} from 'UnityEngine'
import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from './GameManager';
import PunchManager from './PunchManager';

interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {

    private _hitFlag: boolean = false;
    private gameManager: GameManager;

    Awake() {
        this.transform.GetChild(0).gameObject.AddComponent<PunchManager>();
        this.gameManager = GameObject.FindObjectOfType<GameManager>();
    }

    //피격 받았을 때
    OnControllerColliderHit(hit: ControllerColliderHit) {
        if (hit.transform.root == this.transform)
            return;

        else if (hit.transform.name == "hand_R" && !this._hitFlag) {
            console.log("hand");
            this.gameManager.Kill(hit.transform.root, this.transform.root)
            this._hitFlag = true;
        }
    }

}