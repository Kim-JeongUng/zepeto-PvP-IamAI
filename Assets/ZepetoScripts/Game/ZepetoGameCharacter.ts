import {Transform, ControllerColliderHit, GameObject, SphereCollider, Vector3} from 'UnityEngine'
import {ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import GameManager from './GameManager';
import PunchManager from './PunchManager';
import {Users, ZepetoWorldHelper} from "ZEPETO.World";
import {Text} from "UnityEngine.UI";
import {Room} from "ZEPETO.Multiplay";
import ClientStarterV2 from './ClientStarterV2';

interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {
    public sessionID: string;
    public nickname: string;
    public userID: string;
    public isAI:boolean;

    private punchManager: PunchManager;
    private _hitFlag: boolean = false;
    private room:Room;


    Start() {
        this.punchManager = this.transform.GetChild(0).gameObject.AddComponent<PunchManager>();
        this.isAI = this.transform.CompareTag("AI") ? true: false;
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

        this.room = ClientStarterV2.instance.room;
        this.room.AddMessageHandler("GameStart", (message) => {
            this.punchManager.gameObject.SetActive(true);
        });
        
    }
}