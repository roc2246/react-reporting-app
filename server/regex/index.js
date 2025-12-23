module.exports = {
  customerNotes: function () {
    return {
      duplicate: /\((2|[3-9]|\d{2,})\)\s*[A-Z0-9\-]+(?=:)/g,
      itemCode: /\((?=[2-9]|\d{2,})\d+\)\s*([A-Z\-]+)(?=:)/g,
      quantity: /\((\d+)\)([^\(\)]+)/g,
      orderNo: /\b\d+\b(?!\))/g,
    };
  },
  items: function (){
    return{
        collars: /DC-GL-PI-RD-NOPNT|DC-GL-NOPNT/g,
        bandanas: /Matched Bandana|Bandana-B-L|Bandana-B-S|Bandana-P-L|Bandana-P-S|Bandana-R-L|Bandana-R-S|Bandana-G-L|Bandana-G-S/g,
        mats: {
          total: /PM-FL-S|CM-S|PM-FL-L|CM-L|PM-FL-XL|CM-XL/g,
          small: /PM-FL-S|CM-S/g,
          large: /PM-FL-L|CM-L/g,
          xl: /PM-FL-XL|CM-XL/g,
        },
        totalBlankets: /BBL-SE/g,
        dyeBlankets: /\(\d+\)BBL-SE.*High Contrast/g,
        etchBlankets: /\(\d+\)BBL-SE.*Standard Contrast/g,
        hats: /Matching Hat/g,
        bibs: /Matching Bib/g,
        miniBears: /Matching Bear/g,
        giftBaskets: /Gift Basket/g,
        throwBlankets: /THROW/g,
        bearBlankets: {
          total: /BBL-TB-PI|BBL-TB-BL|BBL-TB-BR/g,
          pink: /BBL-TB-PI/g,
          blue: /BBL-TB-BL/g,
          brown: /BBL-TB-BR/g,
        },
        unicorn: /BBL-UNI-PU/g,
        trivets: /TRIVET/g,
        cuttingBoards: /CUT/g,
        potHolders: /^(?!.*(DC-GL-PI-RD-NOPNT|DC-GL-NOPNT)).*Matching Holder/g,
        towels: /Matching Towel/g,
        petBlankets: {
          total: /DB-S|CB-S|DB-L|CB-L|DB-XL|CB-XL/g,
          small: /DB-S|CB-S/g,
          large: /DB-L|CB-L/g,
          xl: /DB-XL|CB-XL/g,
        },
        giftWrappedItem: /GIFT WRAPPED ORDER/g,
        total: /DC-GL-PI-RD-NOPNT|DC-GL-NOPNT|Matched Bandana|Bandana-B-L|Bandana-B-S|Bandana-P-L|Bandana-P-S|Bandana-R-L|Bandana-R-S|Bandana-G-L|Bandana-G-S|PM-FL-S|CM-S|PM-FL-L|CM-L|PM-FL-XL|CM-XL|BBL-SE|Matching Hat|Matching Bib|Matching Bear|Gift Basket|THROW|BBL-TB-PI|BBL-TB-BL|BBL-TB-BR|BBL-UNI-PU|TRIVET|CUT|Matching Towel|DB-S|CB-S|DB-L|CB-L|DB-XL|CB-XL/g
      }
  }
};
