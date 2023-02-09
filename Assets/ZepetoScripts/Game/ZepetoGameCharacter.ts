import {
    Transform,
    ControllerColliderHit,
    GameObject,
    SphereCollider,
    Vector3,
    Animator,
    HumanBodyBones, LayerMask
} from 'UnityEngine'
import {ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import GameManager from './GameManager';
import {Users, ZepetoWorldHelper} from "ZEPETO.World";
import {Text} from "UnityEngine.UI";
import {Room} from "ZEPETO.Multiplay";
import RightHand from './RightHand';
import MultiplayManager from '../MultiplaySync/Common/MultiplayManager';
import PlayerSync from '../MultiplaySync/Player/PlayerSync';

interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

export enum MotionState {
    Idle,
    Punch,
    Defense,
    Die
}

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {
    public sessionID: string;
    public nickname: string;
    public userID: string;
    public motionState: MotionState;
    public rightHand: SphereCollider;

    private room: Room;    
    private animator: Animator;


    private Start() {
        this.userID = this.GetComponent<PlayerSync>()?.player?.zepetoUserId;
        if (this.userID != null) {
            let usersID: string[] = [];
            usersID.push(this.userID);
            // 닉네임가져오기
            ZepetoWorldHelper.GetUserInfo(usersID, (info: Users[]) => {
                    for (let i = 0; i < info.length; i++) {
                        this.nickname = info[0].name;
                    }
                },
                (error) => {
                    console.log(error);
                });
        } else {
            this.nickname = this.sessionID;
        }

        this.room = MultiplayManager.instance.room;
        this.room.AddMessageHandler("GameStart", (message) => {
            this.transform.GetChild(0).gameObject.SetActive(true);
            this.motionState = MotionState.Idle;            
            this.gameObject.layer = LayerMask.NameToLayer("Default");
        });

        this.animator = this.GetComponentInChildren<Animator>();
        this.rightHand = this.animator.GetBoneTransform(HumanBodyBones.RightHand).gameObject.AddComponent<SphereCollider>();
        this.rightHand.gameObject.AddComponent<RightHand>();
        this.rightHand.isTrigger = true;
        this.PunchStop();
    }

    public PunchStart() {
        this.rightHand.enabled = true;
    }

    public PunchStop() {
        this.rightHand.enabled = false;
        this.motionState = MotionState.Idle;
    }

}