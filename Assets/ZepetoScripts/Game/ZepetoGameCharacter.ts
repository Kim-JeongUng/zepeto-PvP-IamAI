import {Transform, ControllerColliderHit, GameObject, SphereCollider, Vector3} from 'UnityEngine'
import {ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import GameManager from './GameManager';
import PunchManager from './PunchManager';
import {Users, ZepetoWorldHelper} from "ZEPETO.World";
import {Text} from "UnityEngine.UI";

interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {
    public sessionID: string;
    public nickname: string;
    public userID: string;

    private punchManager: PunchManager;
    private _hitFlag: boolean = false;
    private gameManager: GameManager;

    Awake() {
        this.punchManager = this.transform.GetChild(0).gameObject.AddComponent<PunchManager>();
        this.gameManager = GameObject.FindObjectOfType<GameManager>();
    }

    Start() {
        if (this.userID != null) {
            let usersID: string[] = [];
            usersID.push(this.userID);
            ZepetoWorldHelper.GetUserInfo(usersID, (info: Users[]) => {
                    for (let i = 0; i < info.length; i++) {
                        this.nickname = info[0].name;
                    }
                },
                (error) => {
                    console.log(error);
                });
        }
        else{
            this.nickname = this.sessionID;
        }
    }

    //�ǰ� �޾��� ��
    OnControllerColliderHit(hit: ControllerColliderHit) {
        if (hit.transform.root == this.transform)
            return;

        else if (hit.transform.name == "hand_R" && !this._hitFlag) {

            const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.sessionID).character;
            /*const position = new Vector3(zepetoPlayer.transform.position.x,0,zepetoPlayer.transform.position.z);
            const rotation = zepetoPlayer.transform.rotation;
            zepetoPlayer.Teleport(position,rotation);*/
            zepetoPlayer.StopMoving()
                
            this.gameManager.Kill(hit.transform.root, this.transform.root)
            this._hitFlag = true;
        }
    }

}