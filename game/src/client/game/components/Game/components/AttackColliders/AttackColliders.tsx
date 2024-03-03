import React from "react";
import { useSnapshot } from "valtio";
import {attackColliders} from "../../../Player/hooks/attack";
import AttackCollider from "./components/AttackCollider/AttackCollider";

const AttackColliders: React.FC = () => {

    const colliders = useSnapshot(attackColliders).colliders;

    return <>
        {
            colliders.map(({id, x, y, vX, vY, expires}) => (
                <AttackCollider id={id} x={x} y={y} vX={vX} vY={vY} expires={expires} key={id}/>
            ))
        }
    </>;
};

export default AttackColliders;