import {
    Transform,
    ControllerColliderHit,
    GameObject,
    SphereCollider,
    Vector3,
    Animator,
    HumanBodyBones
} from 'UnityEngine'
import {ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import GameManager from './GameManager';
import {Users, ZepetoWorldHelper} from "ZEPETO.World";
import {Text} from "UnityEngine.UI";
import {Room} from "ZEPETO.Multiplay";
import ClientStarterV2 from './ClientStarterV2';
import RightHand from './RightHand';

interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

export enum MotionState{
    Idle,
    Punch,
    Defense,
    Die
}

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {
    public sessionID: string;
    public nickname: string;
    public userID: string;
    public motionState:MotionState;
    
    public animator: Animator;
    public rightHand: SphereCollider;

    private _hitFlag: boolean = false;
    private room:Room;

    
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

        this.room = ClientStarterV2.instance.room;
        this.room.AddMessageHandler("GameStart", (message) => {
            this.transform.GetChild(0).gameObject.SetActive(true);
            this.motionState = MotionState.Idle;
        });

        this.animator = this.GetComponentInChildren<Animator>();
        this.rightHand = this.animator.GetBoneTransform(HumanBodyBones.RightHand).gameObject.AddComponent<SphereCollider>();
        this.rightHand.gameObject.AddComponent<RightHand>();
        this.rightHand.isTrigger = true;
        this.PunchStop();
    }

    public PunchStart() {
        this.rightHand.enabled = true;
        this.motionState = MotionState.Punch;
    }
    public PunchStop() {
        this.rightHand.enabled = false;
        this.motionState = MotionState.Idle;
    }
    public DefenseStart() {
        this.motionState = MotionState.Defense;
    }
    public DefenseStop() {
        this.motionState = MotionState.Idle;
    }
    public Die() {
        this.motionState = MotionState.Die;
    }
    
}