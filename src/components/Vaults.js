import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {BsBoxArrowInUpRight, BsClipboardPlus, BsX} from 'react-icons/bs';
import {GetExplorerLink, TruncateAddress} from '../utils/utils';
import {useDebouncedCallback} from 'use-debounce';
import {useApp} from '../context/useApp';
import useLocalStorage from 'use-local-storage';
import useKeypress from 'react-use-keypress';
import toast from 'react-hot-toast';

const curveRe = /curve|crv/i;

export default function Vaults() {
	const navigate = useNavigate();
	const {vaults} = useApp();
	const [filter, setFilter] = useState([]);
	const [query, setQuery] = useLocalStorage('Vaults.query', '');
	const queryRe = useMemo(() => { return new RegExp(query, 'i'); }, [query]);
	const debounceQuery = useDebouncedCallback(value => {setQuery(value);}, 250);
	const queryElement = useRef();
	const [chips, setChips] = useLocalStorage('Vaults.chips', {
		curve: false,
		ethereum: true,
		fantom: true
	});

	useEffect(() => {
		setFilter(vaults.filter(vault => {
			if(query && !queryRe.test(vault.name)) return false;
			if(!chips.ethereum && vault.provider.network.name === 'ethereum') return false;
			if(!chips.fantom && vault.provider.network.name === 'fantom') return false;
			return chips.curve || !curveRe.test(vault.name);
		}));
	}, [query, queryRe, chips, vaults]);

	useKeypress(['/'], () => {
		setTimeout(() => {
			queryElement.current.focus();
		}, 0);
	});

	function chip(tag) {
		return <div onClick={() => {setChips({...chips, [tag]: !chips[tag]});}} 
			className={`chip-${tag} chip ${chips[tag] ? ` hot-${tag}` : ''}`}>{tag}</div>;
	}

	function styleTitle(title) {
		const match = title.match(queryRe);
		if (match) {
			const matchedText = match[0];
			const left = title.substring(0, match.index);
			const middle = title.substring(match.index, match.index + matchedText.length);
			const right = title.substring(match.index + matchedText.length);
			return <>
				{left}
				<span className={'rainbow-text'}>{middle}</span>
				{right}
			</>;
		}

		return title;
	}

	function clearQuery() {
		setQuery('');
		queryElement.current.value = '';
	}

	return <div className={'vaults'}>
		<div className={'filter'}>
			<div className={'flex items-center'}>
				<div className={'relative flex items-center'}>
					<input ref={queryElement} onChange={(e) => {debounceQuery(e.target.value);}} defaultValue={query} type={'text'} placeholder={'/ Filter by name'} />
					{query && <div onClick={clearQuery} className={'absolute right-4 small-circle-icon-button'}>
						<BsX />
					</div>}
				</div>
				{chip('curve')}
				{chip('ethereum')}
				{chip('fantom')}
			</div>
			<div className={'text-2xl'}>
				{`${filter.length} Vaults`}
			</div>
		</div>
		<div className={'list'}>
			{filter.map(vault => {
				return <div key={vault.address} className={'tile'}>
					<div onClick={() => {navigate(`/vault/${vault.address}`);}} className={'title-button'}>
						<div className={'title'}>{styleTitle(vault.name)}</div>
						<div className={'version'}>{vault.version}</div>
					</div>
					<div className={'flex items-center justify-between'}>
						<div className={'flex items-center address'}>
							<div onClick={() => {
								toast(`${vault.address} copied to your clipboard`);
								navigator.clipboard.writeText(vault.address);
							}}
							className={'copy'}
							title={`Copy ${vault.address} to your clipboard`}>
								{TruncateAddress(vault.address)}
								<BsClipboardPlus className={'icon'} />
							</div>
							<a title={`Explore ${vault.address}`}
								href={GetExplorerLink(vault.provider.network.chainId, vault.address)}
								className={'small-circle-icon-button'}>
								<BsBoxArrowInUpRight />
							</a>
						</div>
						<div className={`network ${vault.provider.network.name}`}>{vault.provider.network.name}</div>
					</div>
				</div>;
			})}
		</div>
	</div>;
}