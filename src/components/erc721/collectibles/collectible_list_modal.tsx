import React from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components';

import { selectCollectible } from '../../../store/collectibles/actions';
import { getIsCollectibleListModalOpen, getUserCollectibles } from '../../../store/selectors';
import { toggleCollectibleListModal } from '../../../store/ui/actions';
import { Theme } from '../../../themes/commons';
import { Collectible, StoreState } from '../../../util/types';
import { CloseModalButton } from '../../common/icons/close_modal_button';
import { Search } from '../common/inputSearch';

import { CollectibleOnListContainer } from './collectible_details_list';

interface StateProps {
    userCollectibles: { [key: string]: Collectible };
    isCollectibleModalOpen: boolean;
}

interface DispatchProps {
    updateSelectedCollectible: (collectible: Collectible | null) => any;
    toggleCollectibleListModal: () => any;
}

interface OwnProps {
    theme: Theme;
}

type Props = OwnProps & DispatchProps & StateProps;

interface State {
    currentCollectible: Collectible | null;
    filteredCollectibles: Collectible[];
    filterText: string;
}

const ModalContent = styled.div`
    width: 350px;
`;

const ModalTitleWrapper = styled.div`
    align-items: center;
    border-bottom: 1px solid ${props => props.theme.componentsTheme.borderColor};
    display: flex;
    justify-content: space-between;
    margin: -3px -16px 15px;
    padding: 0 16px 13px;
`;

const ModalTitle = styled.h2`
    color: ${props => props.theme.componentsTheme.cardTitleColor};
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    margin: 0;
    padding: 0 15px 0 0;
`;

const CloseModalButtonStyle = styled(CloseModalButton)`
    margin: 0;
`;

const initialState = {
    currentCollectible: null,
    filteredCollectibles: [],
    filterText: '',
};

class CollectibleListModalContainer extends React.Component<Props, State> {
    public state: State = {
        ...initialState,
    };

    public static getDerivedStateFromProps = (nextProps: Props, prevState: State) => {
        const { userCollectibles } = nextProps;
        const newUserCollectiblesArray = Object.keys(userCollectibles).map(key => userCollectibles[key]);
        if (prevState.filteredCollectibles !== newUserCollectiblesArray) {
            return {
                filteredCollectibles: newUserCollectiblesArray,
                prevFilterText: prevState.filterText,
            };
        }
        // Return null to indicate no change to state.
        return null;
    };

    public render = () => {
        const { theme, isCollectibleModalOpen } = this.props;
        const { filteredCollectibles } = this.state;

        let content = null;
        if (filteredCollectibles && filteredCollectibles.length > 1) {
            const testCollectibles = [filteredCollectibles[0], filteredCollectibles[1]];
            content = testCollectibles.map((item, index) => {
                return <CollectibleOnListContainer collectible={item} onClick={this._closeModal} key={index} />;
            });
        }
        return (
            <Modal isOpen={isCollectibleModalOpen} style={theme.modalTheme} onRequestClose={this._closeModal}>
                <ModalTitleWrapper>
                    <ModalTitle>Selling Item</ModalTitle>
                    <CloseModalButtonStyle onClick={this._closeModal} />
                </ModalTitleWrapper>
                <ModalContent>
                    <Search placeHolder={'Search Wallet'} onChange={this._handleSearchInputChanged} />
                    {content}
                </ModalContent>
            </Modal>
        );
    };

    private readonly _closeModal = () => {
        this.props.toggleCollectibleListModal();
    };

    private readonly _handleSearchInputChanged = (event: any) => {
        const newInputValue = event && event.target ? event.target.value : '';
        const { filteredCollectibles } = this.state;
        const newFilteredCollectibles = this._filterCollectiblesByName(filteredCollectibles, newInputValue);
        this.setState({
            filteredCollectibles: newFilteredCollectibles,
            filterText: newInputValue,
        });
    };

    private readonly _filterCollectiblesByName = (collectibles: Collectible[], name: string): Collectible[] => {
        return [];
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        userCollectibles: getUserCollectibles(state),
        isCollectibleModalOpen: getIsCollectibleListModalOpen(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        updateSelectedCollectible: (collectible: Collectible | null) => dispatch(selectCollectible(collectible)),
        toggleCollectibleListModal: () => dispatch(toggleCollectibleListModal()),
    };
};

const CollectibleListModal = withTheme(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(CollectibleListModalContainer),
);

export { CollectibleListModal };
